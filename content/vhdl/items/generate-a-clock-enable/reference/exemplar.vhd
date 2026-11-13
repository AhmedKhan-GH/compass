library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (clk, reset : in std_logic;
    update : out std_logic;
    updates : out std_logic_vector(3 downto 0));
end entity;
architecture rtl of top_module is
    signal divider : unsigned(1 downto 0) := (others=>'0');
    signal updates_r: unsigned(3 downto 0):=(others=>'0');
    signal update_r:std_logic:='0';
    begin
    update<=update_r;
    updates<=std_logic_vector(updates_r);
    process(clk) begin if rising_edge(clk) then if reset='1' then divider<=(others=>'0');
        update_r<='0';
        updates_r<=(others=>'0');
    elsif divider=3 then divider<=(others=>'0');
        update_r<='1';
        updates_r<=updates_r+1;
    else divider<=divider+1;
        update_r<='0';
    end if;
end if;
end process;
end architecture;
