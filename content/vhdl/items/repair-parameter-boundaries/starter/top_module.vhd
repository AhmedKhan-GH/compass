library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    generic (
        WIDTH : positive := 1;
        DEPTH : positive := 3;
        ADDR_WIDTH : positive := 2
    );
    port (
        clk, reset, en : in std_logic;
        data_in : in std_logic_vector(WIDTH - 1 downto 0);
        data_out : out std_logic_vector(WIDTH - 1 downto 0)
    );
end entity;

architecture rtl of top_module is
    type mem_t is array (0 to DEPTH - 1) of std_logic_vector(WIDTH - 1 downto 0);
    signal mem : mem_t;
    signal addr : natural range 0 to 2 ** ADDR_WIDTH - 1 := 0;
    signal data_r : std_logic_vector(WIDTH - 1 downto 0) := (others => '0');
begin
    data_out <= data_r;

    process(clk)
    begin
        if rising_edge(clk) then
            if reset = '1' then
                addr <= 0;
                data_r <= (others => '0');
            elsif en = '1' then
                mem(addr) <= data_in;
                data_r <= data_in;
                -- The recorder eventually selects a slot that does not exist.
                addr <= addr + 1;
            end if;
        end if;
    end process;
end architecture;
