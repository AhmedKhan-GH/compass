library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        mode : in std_logic_vector(2 downto 0);
        lamps : out std_logic_vector(3 downto 0);
        enabled : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    process(all) begin lamps <= "0000"; enabled <= '1'; case mode is when "000" => lamps <= "0001"; enabled <= '0'; when "001" => lamps <= "0010"; when "010" => lamps <= "0100"; when "011" => lamps <= "1000"; when others => enabled <= '0'; end case; end process;
end architecture;
