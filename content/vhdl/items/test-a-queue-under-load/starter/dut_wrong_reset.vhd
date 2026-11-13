library ieee; use ieee.std_logic_1164.all;
entity dut is port (clk, reset, push, pop : in std_logic; din : in std_logic_vector(7 downto 0); dout : out std_logic_vector(7 downto 0); empty : out std_logic); end entity;
architecture rtl of dut is
    type mem_t is array (0 to 3) of std_logic_vector(7 downto 0); signal mem : mem_t := (others => (others => '0'));
    signal wp, rp : integer range 0 to 3 := 0; signal count : integer range 0 to 4 := 0;
begin
    dout <= mem(rp); empty <= '1' when count = 0 else '0';
    process(clk) begin if rising_edge(clk) then
        if push = '1' and count < 4 then mem(wp) <= din; wp <= (wp + 1) mod 4; end if;
        if pop = '1' and count > 0 then rp <= (rp + 1) mod 4; end if;
        if push = '1' and count < 4 and not (pop = '1' and count > 0) then count <= count + 1;
        elsif pop = '1' and count > 0 and not (push = '1' and count < 4) then count <= count - 1; end if;
    end if; end process;
end architecture;
